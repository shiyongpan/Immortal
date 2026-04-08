export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-yellow-800/50 rounded-lg w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-900/30">
            <h3 className="text-yellow-400 font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 pb-4 flex gap-2 justify-end border-t border-gray-800 pt-3">{footer}</div>}
      </div>
    </div>
  );
}
