export default function handler(req, res) {
  const target = process.env.BACKEND_URL;

  return createProxyMiddleware({
    target,
    changeOrigin: true,
  })(req, res);
}
