class Router {
  constructor() {
    this.rutas = [];
  }

  get(path, handler) {
    this.rutas.push({ method: 'GET', path, handler });
  }

  post(path, handler) {
    this.rutas.push({ method: 'POST', path, handler });
  }

  options(path, handler) {
    this.rutas.push({ method: 'OPTIONS', path, handler });
  }

  async handle(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    res.json = (data, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    res.error = (message, status = 400) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: message }));
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const urlPath = req.url.split('?')[0].replace(/\/$/, '') || '/';
    const match = this.rutas.find(r => r.method === req.method && r.path === urlPath);

    if (!match) {
      return res.error('Ruta no encontrada', 404);
    }

    if (req.method === 'POST') {
      try {
        req.body = await this._parseBody(req);
      } catch (err) {
        return res.error(`Cuerpo de petición JSON inválido: ${err.message}`, 400);
      }
    } else {
      req.body = {};
    }

    try {
      await match.handler(req, res);
    } catch (err) {
      console.error(`[!] [Router Error] en ${req.method} ${urlPath}:`, err.message);
      if (!res.writableEnded) {
        res.error(err.message, 500);
      }
    }
  }

  _parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 1e6) {
          req.destroy();
          reject(new Error('Payload demasiado grande'));
        }
      });
      req.on('end', () => {
        if (!body.trim()) {
          return resolve({});
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  }
}

module.exports = Router;
