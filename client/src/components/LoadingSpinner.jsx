export default function LoadingSpinner({ text = 'लोड हो रहा है...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
