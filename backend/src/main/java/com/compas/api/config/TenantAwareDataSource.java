package com.compas.api.config;

import com.compas.api.auth.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;

/**
 * DataSource wrapper that applies PostgreSQL Row-Level Security session variables
 * (app.current_nutritionist_id and app.bypass_rls) whenever a connection is acquired.
 */
public class TenantAwareDataSource extends DelegatingDataSource {

    private static final Logger LOG = LoggerFactory.getLogger(TenantAwareDataSource.class);

    public TenantAwareDataSource(DataSource targetDataSource) {
        super(targetDataSource);
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection conn = super.getConnection();
        boolean isPostgres;
        try {
            isPostgres = isPostgreSQL(conn);
            if (isPostgres) {
                applyTenantContext(conn);
            }
        } catch (SQLException e) {
            closeQuietly(conn, e);
            throw e;
        }
        return TenantAwareConnection.wrap(conn, isPostgres);
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection conn = super.getConnection(username, password);
        boolean isPostgres;
        try {
            isPostgres = isPostgreSQL(conn);
            if (isPostgres) {
                applyTenantContext(conn);
            }
        } catch (SQLException e) {
            closeQuietly(conn, e);
            throw e;
        }
        return TenantAwareConnection.wrap(conn, isPostgres);
    }

    private void closeQuietly(Connection conn, SQLException originalEx) {
        try {
            conn.close();
        } catch (SQLException closeEx) {
            originalEx.addSuppressed(closeEx);
            LOG.warn("Failed to close connection after tenant context error: {}", closeEx.getMessage());
        }
    }

    private void applyTenantContext(Connection conn) throws SQLException {
        String tenantIdStr = "";
        String bypassStr = "off";

        if (TenantContext.isBypassRls()) {
            bypassStr = "on";
        } else {
            Optional<UUID> tenantOpt = TenantContext.getTenantId();
            if (tenantOpt.isPresent()) {
                tenantIdStr = tenantOpt.get().toString();
            }
        }

        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT set_config('app.current_nutritionist_id', ?, false), "
                        + "set_config('app.bypass_rls', ?, false)")) {
            ps.setString(1, tenantIdStr);
            ps.setString(2, bypassStr);
            ps.execute();
        } catch (SQLException e) {
            LOG.error("Failed to set PostgreSQL RLS tenant context on connection: {}", e.getMessage());
            throw e;
        }
    }

    private boolean isPostgreSQL(Connection conn) throws SQLException {
        return "PostgreSQL".equalsIgnoreCase(conn.getMetaData().getDatabaseProductName());
    }
}
