/**
 * Basic shared-key gate for the dashboard API.
 * Set DASHBOARD_API_KEY in backend/.env to require it; leave unset to keep
 * the API open (local dev). Accepts the key via header (fetch calls) or
 * ?key= query param (native EventSource can't set custom headers).
 */
function auth(req, res, next) {
  const required = process.env.DASHBOARD_API_KEY;
  if (!required) return next();

  const provided = req.headers['x-dashboard-key'] || req.query.key;
  if (provided !== required) {
    return res.status(401).json({ error: 'Unauthorized — missing or invalid dashboard key' });
  }
  next();
}

module.exports = auth;
