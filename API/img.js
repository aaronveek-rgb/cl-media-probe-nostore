// Cache-busting proxy that serves the image with a real no-store header.
//
// Why a proxy: GitHub Pages hardcodes max-age=600 at its Fastly edge and
// cannot be configured. A unique query param on every upstream request makes
// each one a distinct URL, so Fastly always misses and we always read origin
// bytes. The response we return carries no-store, which is the header Vercel
// refuses to set on static assets.

module.exports = async (req, res) => {
  const UPSTREAM = 'https://aaronveek-rgb.github.io/cl-media-probe/img.png';

  try {
    const bust = UPSTREAM + '?t=' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const upstream = await fetch(bust, { cache: 'no-store' });

    if (!upstream.ok) {
      res.status(502).json({ error: 'upstream', status: upstream.status });
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
