export function DropZoneOverlay({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg/90 flex items-center justify-center pointer-events-none">
      <div className="border-2 border-dashed border-warm rounded-2xl p-16 text-center">
        <div className="text-4xl mb-4">📎</div>
        <div className="text-xl text-warm font-medium">Drop files to add context</div>
        <div className="text-sm text-gray-400 mt-2">Text, code, images, or PDFs</div>
      </div>
    </div>
  );
}
