export async function DELETE() {
  return new Response(null, { status: 200 });
}

export async function PUT() {
  return new Response(JSON.stringify({}), { status: 200 });
}

export async function GET() {
  return new Response(JSON.stringify({}), { status: 200 });
}

// Minimal POST handler for completeness
export async function POST() {
  return new Response(JSON.stringify({}), { status: 200 });
}
