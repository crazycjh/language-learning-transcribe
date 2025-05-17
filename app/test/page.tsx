import ClientComponent from './ClientComponent';

export default function Page() {
  return (
    <div>
      <h1>Server Rendered Page</h1>
      <ClientComponent />  {/* 包含 Client Component */}
    </div>
  );
}