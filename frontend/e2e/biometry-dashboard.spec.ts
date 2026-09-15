import { test, expect } from '@playwright/test';
import {
  completeOnboardingViaApi,
  createPatientPayload,
  signupViaApi,
  uniqueEmail,
  API_BASE,
} from './helpers';

test.describe('Biometry & Dashboard — API Contract', () => {
  let accessToken: string;
  let patientId: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Biometria', objective: 'EMAGRECIMENTO' }),
    });
    expect(createResp.status()).toBe(201);
    patientId = (await createResp.json()).data.id;
  });

  test.afterEach(async ({ request }) => {
    if (patientId) {
      await request
        .delete(`${API_BASE}/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
  });

  test('E2E-BIO-00: Create patient with pt-BR objective label returns 400', async ({ request }) => {
    const resp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Label', objective: 'Emagrecimento' }),
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-BIO-01: Create biometry assessment succeeds', async ({ request }) => {
    const resp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-24',
        weight: 72.5,
        bodyFatPercent: 28.3,
        leanMassKg: 52.0,
        waterPercent: 55.1,
        visceralFatLevel: 8,
        bmrKcal: 1480,
        device: 'Omron HBF-514C',
        notes: 'Primeira avaliação',
        skinfolds: [
          { measureKey: 'triceps', valueMm: 18.5, sortOrder: 1 },
          { measureKey: 'biceps', valueMm: 10.2, sortOrder: 2 },
        ],
        perimetry: [{ measureKey: 'cintura', valueCm: 82.3, sortOrder: 1 }],
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.weight).toBe(72.5);
    expect(body.data.bodyFatPercent).toBe(28.3);
    expect(body.data.skinfolds.length).toBe(2);
    expect(body.data.perimetry.length).toBe(1);
  });

  test('E2E-BIO-02: Create biometry without required fields returns 400', async ({ request }) => {
    const resp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { assessmentDate: '2026-04-24' },
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-BIO-03: Create biometry with negative weight returns 400', async ({ request }) => {
    const resp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-24',
        weight: -5.0,
        bodyFatPercent: 25.0,
      },
    });
    expect(resp.status()).toBe(400);
  });

  test('E2E-BIO-04: List biometry assessments returns array', async ({ request }) => {
    await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-20',
        weight: 73.0,
        bodyFatPercent: 29.0,
      },
    });
    await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-24',
        weight: 72.5,
        bodyFatPercent: 28.3,
      },
    });

    const resp = await request.get(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('E2E-BIO-05: Update biometry assessment succeeds', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-24',
        weight: 72.5,
        bodyFatPercent: 28.3,
      },
    });
    const assessmentId = (await createResp.json()).data.id;

    const updateResp = await request.patch(
      `${API_BASE}/patients/${patientId}/biometry/${assessmentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { weight: 71.8, bodyFatPercent: 27.5 },
      },
    );
    expect(updateResp.status()).toBe(200);
    const updated = await updateResp.json();
    expect(updated.data.weight).toBe(71.8);
    expect(updated.data.bodyFatPercent).toBe(27.5);
  });

  test('E2E-BIO-06: Cross-nutritionist biometry access returns 403/404', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-24',
        weight: 72.5,
        bodyFatPercent: 28.3,
      },
    });
    expect(createResp.status()).toBe(201);
    const assessmentId = (await createResp.json()).data.id as string;

    const otherResult = await signupViaApi(request, uniqueEmail());
    await completeOnboardingViaApi(request, otherResult.accessToken);

    const resp = await request.patch(`${API_BASE}/patients/${patientId}/biometry/${assessmentId}`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      data: { weight: 71.2, bodyFatPercent: 27.4 },
    });
    expect([403, 404]).toContain(resp.status());
  });

  test('E2E-BIO-07: Unauthenticated biometry access returns 401', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/patients/${patientId}/biometry`);
    expect(resp.status()).toBe(401);
  });

  test('E2E-BIO-11: Cross-tenant GETs de biometria e histórico retornam 403/404', async ({
    request,
  }) => {
    const otherResult = await signupViaApi(request, uniqueEmail());
    await completeOnboardingViaApi(request, otherResult.accessToken);

    const otherPatientResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      data: createPatientPayload({
        name: 'Paciente Cross Tenant GET',
        objective: 'EMAGRECIMENTO',
      }),
    });
    expect(otherPatientResp.status()).toBe(201);
    const otherPatientId = (await otherPatientResp.json()).data.id as string;

    const otherBiometryResp = await request.post(
      `${API_BASE}/patients/${otherPatientId}/biometry`,
      {
        headers: { Authorization: `Bearer ${otherResult.accessToken}` },
        data: {
          assessmentDate: '2026-04-24',
          weight: 80.4,
          bodyFatPercent: 30.1,
        },
      },
    );
    expect(otherBiometryResp.status()).toBe(201);

    const deactivateResp = await request.patch(
      `${API_BASE}/patients/${otherPatientId}/deactivate`,
      {
        headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      },
    );
    expect(deactivateResp.status()).toBe(200);

    const ownListResp = await request.get(`${API_BASE}/patients/${otherPatientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(ownListResp.status());

    const ownHistoryResp = await request.get(
      `${API_BASE}/patients/${otherPatientId}/biometry/history/episodes`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect([403, 404]).toContain(ownHistoryResp.status());

    const otherEpisodesResp = await request.get(
      `${API_BASE}/patients/${otherPatientId}/biometry/history/episodes`,
      {
        headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      },
    );
    expect(otherEpisodesResp.status()).toBe(200);
    const episodeId = (await otherEpisodesResp.json()).data[0].episodeId as string;

    const ownSnapshotResp = await request.get(
      `${API_BASE}/patients/${otherPatientId}/biometry/history/episodes/${episodeId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect([403, 404]).toContain(ownSnapshotResp.status());
  });

  test('E2E-DASH-01: Dashboard returns correct KPI contract', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('kpis');
    expect(body.data.kpis).toHaveProperty('activePatients');
    expect(body.data.kpis).toHaveProperty('onTrackPatients');
    expect(body.data.kpis).toHaveProperty('attentionPatients');
    expect(body.data.kpis).toHaveProperty('criticalPatients');
    expect(body.data.kpis).toHaveProperty('averageAdherence');
    expect(body.data.kpis).toHaveProperty('assessedInLast30Days');
    expect(body.data.kpis).toHaveProperty('pendingAssessmentCount');
    expect(body.data).toHaveProperty('recentEvaluations');
    expect(Array.isArray(body.data.recentEvaluations)).toBe(true);
  });

  test('E2E-DASH-02: Dashboard unauthenticated returns 401', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/dashboard`);
    expect(resp.status()).toBe(401);
  });

  test('E2E-DASH-03: Dashboard reflects created patients', async ({ request }) => {
    await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Dashboard 1', objective: 'HIPERTROFIA' }),
    });
    await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Dashboard 2', objective: 'SAUDE_GERAL' }),
    });

    const resp = await request.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.kpis.activePatients).toBeGreaterThanOrEqual(3);
  });

  test('E2E-DASH-04: Dashboard mantém isolamento entre nutricionistas', async ({ request }) => {
    const today = new Date().toISOString().slice(0, 10);

    const ownBiometryResp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: today,
        weight: 72.1,
        bodyFatPercent: 27.9,
      },
    });
    expect(ownBiometryResp.status()).toBe(201);

    const otherResult = await signupViaApi(request, uniqueEmail());
    await completeOnboardingViaApi(request, otherResult.accessToken);

    const otherPatientResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
      data: createPatientPayload({ name: 'Paciente Outro Nutri', objective: 'EMAGRECIMENTO' }),
    });
    expect(otherPatientResp.status()).toBe(201);
    const otherPatientId = (await otherPatientResp.json()).data.id as string;

    const otherBiometryResp = await request.post(
      `${API_BASE}/patients/${otherPatientId}/biometry`,
      {
        headers: { Authorization: `Bearer ${otherResult.accessToken}` },
        data: {
          assessmentDate: today,
          weight: 89.4,
          bodyFatPercent: 33.2,
        },
      },
    );
    expect(otherBiometryResp.status()).toBe(201);

    const ownDashboardResp = await request.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(ownDashboardResp.status()).toBe(200);
    const ownDashboardBody = await ownDashboardResp.json();
    const ownPatientIds = (
      ownDashboardBody.data.recentEvaluations as Array<{ patientId: string }>
    ).map((ev) => ev.patientId);
    expect(ownPatientIds).toContain(patientId);
    expect(ownPatientIds).not.toContain(otherPatientId);

    const otherDashboardResp = await request.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${otherResult.accessToken}` },
    });
    expect(otherDashboardResp.status()).toBe(200);
    const otherDashboardBody = await otherDashboardResp.json();
    const otherPatientIds = (
      otherDashboardBody.data.recentEvaluations as Array<{ patientId: string }>
    ).map((ev) => ev.patientId);
    expect(otherPatientIds).toContain(otherPatientId);
    expect(otherPatientIds).not.toContain(patientId);
  });
});

test.describe('Biometry — History Episodes', () => {
  let accessToken: string;
  let patientId: string;

  test.beforeEach(async ({ request }) => {
    const email = uniqueEmail();
    const result = await signupViaApi(request, email);
    accessToken = result.accessToken;
    await completeOnboardingViaApi(request, accessToken);

    const createResp = await request.post(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: createPatientPayload({ name: 'Paciente Histórico', objective: 'EMAGRECIMENTO' }),
    });
    patientId = (await createResp.json()).data.id;
  });

  test('E2E-BIO-08: List history episodes returns array', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-24',
        weight: 72.5,
        bodyFatPercent: 28.3,
      },
    });
    expect(createResp.status()).toBe(201);

    const deactivateResp = await request.patch(`${API_BASE}/patients/${patientId}/deactivate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deactivateResp.status()).toBe(200);

    const resp = await request.get(`${API_BASE}/patients/${patientId}/biometry/history/episodes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    const ep = body.data[0];
    expect(ep).toHaveProperty('episodeId');
    expect(ep).toHaveProperty('startDate');
    expect(ep).toHaveProperty('endDate');
    expect(ep).toHaveProperty('hasBiometry');
    expect(ep).toHaveProperty('assessmentCount');
    expect(ep).toHaveProperty('durationDays');
    expect(ep.hasBiometry).toBe(true);
    expect(ep.assessmentCount).toBe(1);
  });

  test('E2E-BIO-09: Get history snapshot for episode returns correct contract', async ({
    request,
  }) => {
    const createResp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: '2026-04-24',
        weight: 72.5,
        bodyFatPercent: 28.3,
      },
    });
    expect(createResp.status()).toBe(201);

    const deactivateResp = await request.patch(`${API_BASE}/patients/${patientId}/deactivate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deactivateResp.status()).toBe(200);

    const episodesResp = await request.get(
      `${API_BASE}/patients/${patientId}/biometry/history/episodes`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect(episodesResp.status()).toBe(200);
    const episodes = (await episodesResp.json()).data;
    expect(episodes).toHaveLength(1);

    const episodeId = episodes[0].episodeId;
    const snapshotResp = await request.get(
      `${API_BASE}/patients/${patientId}/biometry/history/episodes/${episodeId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(snapshotResp.status()).toBe(200);
    const snapshot = (await snapshotResp.json()).data;
    expect(snapshot).toHaveProperty('episodeId');
    expect(snapshot.episodeId).toBe(episodeId);
    expect(snapshot).toHaveProperty('startDate');
    expect(snapshot).toHaveProperty('endDate');
    expect(snapshot).toHaveProperty('episodeObjective');
    expect(snapshot.episodeObjective).toBe('Emagrecimento');
    expect(snapshot).toHaveProperty('mealSlotCount');
    expect(snapshot).toHaveProperty('foodItemCount');
    expect(snapshot.assessments).toHaveLength(1);
    expect(snapshot.timelineEvents.length).toBeGreaterThanOrEqual(2);
  });

  test('E2E-BIO-10: Recent evaluations appear in dashboard after biometry', async ({ request }) => {
    const today = new Date().toISOString().slice(0, 10);
    const createResp = await request.post(`${API_BASE}/patients/${patientId}/biometry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        assessmentDate: today,
        weight: 72.5,
        bodyFatPercent: 28.3,
      },
    });
    expect(createResp.status()).toBe(201);

    const dashResp = await request.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(dashResp.status()).toBe(200);
    const dash = (await dashResp.json()).data;
    expect(dash.kpis.assessedInLast30Days).toBeGreaterThanOrEqual(1);
    expect(dash.recentEvaluations).toHaveLength(1);
    const ev = dash.recentEvaluations[0];
    expect(ev).toHaveProperty('patientId');
    expect(ev.patientId).toBe(patientId);
    expect(ev).toHaveProperty('patientName');
    expect(ev.patientName).toBe('Paciente Histórico');
    expect(ev).toHaveProperty('initials');
    expect(ev.initials).toBe('PH');
    expect(ev).toHaveProperty('status');
    expect(ev).toHaveProperty('assessmentDate');
    expect(ev.assessmentDate).toBe(today);
    expect(ev).toHaveProperty('weight');
    expect(ev.weight).toBe(72.5);
    expect(ev).toHaveProperty('bodyFatPercent');
    expect(ev.bodyFatPercent).toBe(28.3);
  });
});
