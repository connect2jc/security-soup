export default function StatusBar({
  status,
}: {
  status: "idle" | "scanning" | "done" | "error";
}) {
  if (status === "idle") return null;

  const config = {
    scanning: {
      text: "Scanning your machine for exposed secrets...",
      bg: "bg-blue-900/50",
      border: "border-blue-500",
    },
    done: {
      text: "Scan complete!",
      bg: "bg-green-900/50",
      border: "border-green-500",
    },
    error: {
      text: "Something went wrong. Please try again.",
      bg: "bg-red-900/50",
      border: "border-red-500",
    },
  }[status];

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg px-4 py-3 text-sm`}
    >
      {config.text}
    </div>
  );
}
