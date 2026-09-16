package com.nutriai.api.config;

import com.nutriai.api.auth.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantAwareDataSourceTest {

    @Mock
    private DataSource targetDataSource;

    @Mock
    private Connection mockConnection;

    @Mock
    private DatabaseMetaData mockMetaData;

    @Mock
    private PreparedStatement mockPreparedStatement;

    private TenantAwareDataSource tenantAwareDataSource;

    @BeforeEach
    void setUp() {
        tenantAwareDataSource = new TenantAwareDataSource(targetDataSource);
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void getConnection_postgresWithTenant_setsConfigAndResetsOnClose() throws SQLException {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        when(targetDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.getMetaData()).thenReturn(mockMetaData);
        when(mockMetaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockPreparedStatement);

        Connection wrapped = tenantAwareDataSource.getConnection();

        assertNotNull(wrapped);
        // Verify tenant set_config was executed
        verify(mockConnection).prepareStatement(
                "SELECT set_config('app.current_nutritionist_id', ?, false), "
                        + "set_config('app.bypass_rls', ?, false)"
        );
        verify(mockPreparedStatement).setString(1, tenantId.toString());
        verify(mockPreparedStatement).setString(2, "off");
        verify(mockPreparedStatement, times(1)).execute();

        // Close connection and verify reset
        when(mockConnection.isClosed()).thenReturn(false);
        wrapped.close();

        verify(mockConnection, times(2)).prepareStatement(anyString());
        verify(mockConnection).close();
    }

    @Test
    void getConnection_postgresWithBypass_setsBypassOn() throws SQLException {
        TenantContext.setBypassRls(true);

        when(targetDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.getMetaData()).thenReturn(mockMetaData);
        when(mockMetaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockPreparedStatement);

        Connection wrapped = tenantAwareDataSource.getConnection();

        assertNotNull(wrapped);
        verify(mockPreparedStatement).setString(1, "");
        verify(mockPreparedStatement).setString(2, "on");
        verify(mockPreparedStatement).execute();
    }

    @Test
    void getConnection_postgresWhenSetConfigFails_throwsSQLExceptionAndClosesConnection() throws SQLException {
        when(targetDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.getMetaData()).thenReturn(mockMetaData);
        when(mockMetaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockPreparedStatement);
        when(mockPreparedStatement.execute()).thenThrow(new SQLException("connection broken"));

        assertThrows(SQLException.class, () -> tenantAwareDataSource.getConnection());
        verify(mockConnection).close();
    }

    @Test
    void getConnection_nonPostgres_skipsSetConfig() throws SQLException {
        when(targetDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.getMetaData()).thenReturn(mockMetaData);
        when(mockMetaData.getDatabaseProductName()).thenReturn("H2");

        Connection wrapped = tenantAwareDataSource.getConnection();

        assertNotNull(wrapped);
        verify(mockConnection, never()).prepareStatement(anyString());

        wrapped.close();
        verify(mockConnection).close();
    }

    @Test
    void getConnection_postgresWhenContextChangesMidConnection_resyncsStatement() throws SQLException {
        TenantContext.setBypassRls(true);

        when(targetDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.getMetaData()).thenReturn(mockMetaData);
        when(mockMetaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockPreparedStatement);

        Connection wrapped = tenantAwareDataSource.getConnection();

        // Initially bypass is set
        verify(mockPreparedStatement).setString(1, "");
        verify(mockPreparedStatement).setString(2, "on");

        // Now switch context to a tenant mid-connection
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        // Preparing a statement triggers resync
        wrapped.prepareStatement("SELECT * FROM patient");

        verify(mockPreparedStatement).setString(1, tenantId.toString());
        verify(mockPreparedStatement).setString(2, "off");
    }

    @Test
    void beanPostProcessor_wrapsDataSource() {
        TenantAwareDataSourceBeanPostProcessor processor = new TenantAwareDataSourceBeanPostProcessor();

        Object wrapped = processor.postProcessAfterInitialization(targetDataSource, "dataSource");
        assertInstanceOf(TenantAwareDataSource.class, wrapped);

        // Does not double-wrap
        Object doubleWrapped = processor.postProcessAfterInitialization(wrapped, "dataSource");
        assertSame(wrapped, doubleWrapped);

        // Ignores other beans
        String otherBean = "notADataSource";
        assertSame(otherBean, processor.postProcessAfterInitialization(otherBean, "otherBean"));

        // Ignores secondary DataSources
        DataSource secondaryDs = mock(DataSource.class);
        assertSame(secondaryDs, processor.postProcessAfterInitialization(secondaryDs, "secondaryDataSource"));
    }
}
