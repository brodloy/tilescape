export default function EventLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body { height: 100%; overflow: hidden; }
        body {
          display: grid !important;
          grid-template-rows: 48px 1fr !important;
          grid-template-columns: 220px 1fr 280px !important;
          grid-template-areas: "top top top" "side main right" !important;
        }
        body::before { display: none !important; }
      `}</style>
      {children}
    </>
  )
}
