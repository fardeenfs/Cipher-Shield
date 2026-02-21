import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stream/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <div>Hello "/stream/$id" {id}!</div>;
}
