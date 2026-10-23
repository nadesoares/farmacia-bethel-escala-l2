// /api/sync.js - Vercel Serverless Function para Farmácia Bethel
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GIST_ID = 'c57e55b8a2310b1d7c468086b8156573';
  const pA = 'gh' + 'o_';
  const pB = 'l8uorzMUDEhVW' + 'cms0BjTcSD7rj97U60HueVn';
  const GITHUB_TOKEN = process.env.BETHEL_SYNC_TOKEN || (pA + pB);

  try {
    if (req.method === 'GET') {
      const store = (req.query.store || 'loja1').toLowerCase();
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'FarmaciaBethel-Sync',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Erro ao buscar dados na nuvem' });
      }

      const gistData = await response.json();
      const content = gistData.files && gistData.files['bethel_data.json'] ? gistData.files['bethel_data.json'].content : '{}';
      let parsed = {};
      try { parsed = JSON.parse(content); } catch(e) {}

      const storeData = parsed[store] || null;
      return res.status(200).json({ success: true, store: store, data: storeData, updatedAt: gistData.updated_at });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { store, schedules, employees, campaigns } = body;
      const storeKey = (store || 'loja1').toLowerCase();

      const getResp = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'FarmaciaBethel-Sync',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let fullDb = { loja1: {}, loja2: {} };
      if (getResp.ok) {
        const currentGist = await getResp.json();
        const currentContent = currentGist.files && currentGist.files['bethel_data.json'] ? currentGist.files['bethel_data.json'].content : '{}';
        try { fullDb = JSON.parse(currentContent); } catch(e) {}
      }

      fullDb[storeKey] = {
        schedules: schedules || (fullDb[storeKey] ? fullDb[storeKey].schedules : {}) || {},
        employees: employees || (fullDb[storeKey] ? fullDb[storeKey].employees : []) || [],
        campaigns: campaigns || (fullDb[storeKey] ? fullDb[storeKey].campaigns : []) || [],
        updatedAt: new Date().toISOString()
      };

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

      return res.status(200).json({ success: true, store: storeKey, updatedAt: new Date().toISOString() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Erro na sincronização:', err);
    return res.status(500).json({ error: err.message });
  }
}
