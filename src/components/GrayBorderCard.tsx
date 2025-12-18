function GrayBorderCard({ className = '', children }: { className?: string, children?: React.ReactNode }) {
  return (
    <div className={`p-4 border border-[#cacbcd] rounded-xl w-full ${className}`}>
      {children}
    </div>
  );
}

export default GrayBorderCard;