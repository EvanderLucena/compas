package com.nutriai.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * Dynamic proxy invocation handler that wraps a java.sql.Connection and resets
 * PostgreSQL Row-Level Security session variables when the connection is closed
 * (returned to the Hikari pool).
 */
public class TenantAwareConnection implements InvocationHandler {

    private static final Logger LOG = LoggerFactory.getLogger(TenantAwareConnection.class);

    private final Connection target;
    private final boolean isPostgres;

    public TenantAwareConnection(Connection target, boolean isPostgres) {
        this.target = target;
        this.isPostgres = isPostgres;
    }

    /**
     * Create a proxied Connection that intercepts close() to reset PostgreSQL RLS session variables.
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
        if ("close".equals(method.getName()) && (args == null || args.length == 0)) {
            resetRlsVariables();
        }
        try {
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw e.getTargetException();
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
            }
        }
    }
}
