export const metadata = {
  title: 'BundleOS | AI E-Commerce Sourcing & Bundle Engine',
  description: 'AI-Powered E-Commerce Bundle Sourcing Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#07080C' }}>
        {children}
      </body>
    </html>
  );
}