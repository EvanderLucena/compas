package com.compas.api.config;

import com.compas.api.auth.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Objects;
import java.util.UUID;

/**
 * Dynamic proxy invocation handler that wraps a java.sql.Connection, synchronizes
 * PostgreSQL Row-Level Security session variables on statement execution whenever
 * TenantContext changes, and resets them when the connection is closed.
 */
public class TenantAwareConnection implements InvocationHandler {

    private static final Logger LOG = LoggerFactory.getLogger(TenantAwareConnection.class);

    private final Connection target;
    private final boolean isPostgres;

    private UUID appliedTenantId;
    private boolean appliedBypass;
    private boolean initialized;

    public TenantAwareConnection(Connection target, boolean isPostgres) {
        this.target = target;
        this.isPostgres = isPostgres;
        if (isPostgres) {
            this.appliedTenantId = TenantContext.getTenantId().orElse(null);
            this.appliedBypass = TenantContext.isBypassRls();
            this.initialized = true;
        }
    }

    /**
     * Create a proxied Connection that intercepts statement creation and close()
     * to keep PostgreSQL RLS session variables strictly synchronized with TenantContext.
     */
    public static Connection wrap(Connection target, boolean isPostgres) {
        return (Connection) Proxy.newProxyInstance(
                TenantAwareConnection.class.getClassLoader(),
                new Class<?>[]{Connection.class},
                new TenantAwareConnection(target, isPostgres)
        );
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        String methodName = method.getName();

        if (isPostgres && isStatementMethod(methodName)) {
            syncTenantContext();
        }

        if ("close".equals(methodName) && (args == null || args.length == 0)) {
            resetRlsVariables();
        }

        try {
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw e.getTargetException();
        }
    }

    private boolean isStatementMethod(String name) {
        return "prepareStatement".equals(name) || "createStatement".equals(name) || "prepareCall".equals(name);
    }

    private void syncTenantContext() throws SQLException {
        if (!isPostgres) {
            return;
        }
        UUID currentTenant = TenantContext.getTenantId().orElse(null);
        boolean currentBypass = TenantContext.isBypassRls();

        if (!initialized || !Objects.equals(appliedTenantId, currentTenant) || appliedBypass != currentBypass) {
            String tenantIdStr = currentTenant != null ? currentTenant.toString() : "";
            String bypassStr = currentBypass ? "on" : "off";

            try (PreparedStatement ps = target.prepareStatement(
                    "SELECT set_config('app.current_nutritionist_id', ?, false), "
                            + "set_config('app.bypass_rls', ?, false)")) {
                ps.setString(1, tenantIdStr);
                ps.setString(2, bypassStr);
                ps.execute();
            } catch (SQLException e) {
                LOG.error("Failed to synchronize PostgreSQL RLS tenant context on statement: {}", e.getMessage());
                throw e;
            }
            this.appliedTenantId = currentTenant;
            this.appliedBypass = currentBypass;
            this.initialized = true;
        }
    }

    private void resetRlsVariables() {
        if (isPostgres) {
            try {
                if (!target.isClosed()) {
                    try (PreparedStatement ps = target.prepareStatement(
                            "SELECT set_config('app.current_nutritionist_id', '', false), "
                                    + "set_config('app.bypass_rls', 'off', false)")) {
                        ps.execute();
                    }
                }
            } catch (SQLException e) {
                LOG.debug("Could not reset PostgreSQL RLS session variables on connection close: {}", e.getMessage());
            } finally {
                this.appliedTenantId = null;
                this.appliedBypass = false;
                this.initialized = false;
            }
        }
    }
}
