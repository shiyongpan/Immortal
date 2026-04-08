export default function Button({ children, onClick, variant = "primary", disabled, loading, className = "", type = "button", size = "md" }) {
  const base = "font-semibold rounded border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1";
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-yellow-700 hover:bg-yellow-600 border-yellow-500 text-gray-950",
    secondary: "bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-200",
    danger: "bg-red-900 hover:bg-red-800 border-red-700 text-red-200",
    ghost: "bg-transparent hover:bg-gray-800 border-transparent text-gray-300",
    purple: "bg-purple-900 hover:bg-purple-800 border-purple-700 text-purple-200",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
