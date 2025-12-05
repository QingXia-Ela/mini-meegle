function MeegleCardFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full bg-white border border-[#d9dbe0] rounded-lg ${className} p-4 mt-4`}>
      {children}
    </div>
  );
}

export default MeegleCardFrame;