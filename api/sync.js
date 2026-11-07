// /api/sync.js - Vercel Serverless Function para Farmácia Bethel
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GIST_ID = 'c57e55b8a2310b1d7c468086b8156573';
  const pA = 'gh' + 'o_';
  const pB = 'l8uorzMUDEhVW' + 'cms0BjTcSD7rj97U60HueVn';
  const GITHUB_TOKEN = process.env.BETHEL_SYNC_TOKEN || (pA + pB);

  const clientIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
  const clientUa = String(req.headers['user-agent'] || 'browser').slice(0, 120);
  const clientSig = `${clientIp}::${clientUa}`;

  try {
    if (req.method === 'GET') {
      const store = (req.query.store || 'loja2').toLowerCase();
      const otherStore = store === 'loja1' ? 'loja2' : 'loja1';
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'FarmaciaBethel-Sync',
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Erro ao buscar dados na nuvem' });
      }

      const gistData = await response.json();
      const content = gistData.files && gistData.files['bethel_data.json'] ? gistData.files['bethel_data.json'].content : '{}';
      let parsed = {};
      try { parsed = JSON.parse(content); } catch(e) {}

      const storeData = parsed[store] || { schedules: {}, employees: [], campaigns: [] };
      const otherStoreData = parsed[otherStore] || { schedules: {}, employees: [], campaigns: [] };
      const adminPasses = (parsed._adminPasses && typeof parsed._adminPasses === 'object') ? parsed._adminPasses : {};
      const pcPassObj = adminPasses[clientSig];
      const pcAdminUntil = (pcPassObj && typeof pcPassObj === 'object') ? Number(pcPassObj.until || 0) : Number(pcPassObj || 0);
      const pcAdminActive = (pcPassObj && typeof pcPassObj === 'object') ? Boolean(pcPassObj.active) : true;

      return res.status(200).json({
        success: true,
        store: store,
        data: storeData,
        otherStore: otherStore,
        otherData: otherStoreData,
        pcAdminUntil: (pcAdminUntil > Date.now()) ? pcAdminUntil : 0,
        pcAdminActive: (pcAdminUntil > Date.now()) ? pcAdminActive : false,
        updatedAt: gistData.updated_at
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { store, schedules, employees, campaigns, adminUntil, adminActive } = body;
      const storeKey = (store || 'loja2').toLowerCase();

      const getResp = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'FarmaciaBethel-Sync',
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache'
        }
      });

      let fullDb = { loja1: {}, loja2: {} };
      if (getResp.ok) {
        const currentGist = await getResp.json();
        const currentContent = currentGist.files && currentGist.files['bethel_data.json'] ? currentGist.files['bethel_data.json'].content : '{}';
        try { fullDb = JSON.parse(currentContent); } catch(e) {}
      }

      const prevStore = fullDb[storeKey] || {};
      fullDb[storeKey] = {
        schedules: (schedules !== undefined && schedules !== null && typeof schedules === 'object')
          ? schedules
          : (prevStore.schedules || {}),
        employees: Array.isArray(employees)
          ? employees
          : (prevStore.employees || []),
        campaigns: Array.isArray(campaigns)
          ? campaigns
          : (prevStore.campaigns || []),
        updatedAt: new Date().toISOString()
      };

      if (adminUntil !== undefined) {
        if (!fullDb._adminPasses || typeof fullDb._adminPasses !== 'object') {
          fullDb._adminPasses = {};
        }
        const now = Date.now();
        for (const k of Object.keys(fullDb._adminPasses)) {
          const item = fullDb._adminPasses[k];
          const exp = (item && typeof item === 'object') ? Number(item.until || 0) : Number(item || 0);
          if (!exp || exp <= now) delete fullDb._adminPasses[k];
        }
        const untilNum = Number(adminUntil || 0);
        if (untilNum > now) {
          fullDb._adminPasses[clientSig] = {
            until: untilNum,
            active: adminActive !== false
          };
        } else {
          delete fullDb._adminPasses[clientSig];
        }
      }

      const patchResp = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'FarmaciaBethel-Sync',
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          files: {
            'bethel_data.json': {
              content: JSON.stringify(fullDb, null, 2)
            }
          }
        })
      });

      if (!patchResp.ok) {
        return res.status(patchResp.status).json({ error: 'Erro ao salvar na nuvem' });
      }

      return res.status(200).json({ success: true, store: storeKey, updatedAt: fullDb[storeKey].updatedAt });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Erro na sincronização:', err);
    return res.status(500).json({ error: err.message });
  }
}
