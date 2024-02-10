const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 border-4 rounded-full border-accent animate-spin border-t-transparent" />
    </div>
  );
};

export default Spinner;
