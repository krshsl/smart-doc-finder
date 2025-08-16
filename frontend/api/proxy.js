import { createProxyMiddleware } from "http-proxy-middleware";

export default function handler(req, res) {
  const target = process.env.BACKEND_URL;

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      "^/api": "",
    },
  })(req, res);
}
