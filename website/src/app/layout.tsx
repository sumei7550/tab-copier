import type { Metadata } from 'next';
import './style.css';
export const metadata: Metadata = { title: 'Tab Copier Pro · 沙盒', description: 'Tab Copier 沙盒支付与自动激活验证' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><header><a href="/">Tab Copier</a><span>沙盒开发 · 不用于正式收款</span><a href="mailto:sumei7550@outlook.com">联系客服</a></header><main>{children}</main></body></html>;
}
