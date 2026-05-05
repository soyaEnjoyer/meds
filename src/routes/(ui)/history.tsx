import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(ui)/history')({
  component: HistoryPage,
});

function HistoryPage() {
  return <div>TODO</div>;
}
