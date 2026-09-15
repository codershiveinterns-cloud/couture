const BLOCK = 'shimmer rounded-sm';

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white" aria-hidden="true">
      <div className={`aspect-[3/4] w-full ${BLOCK}`} />
      <div className="flex flex-col gap-2 px-2.5 pb-3 pt-2.5">
        <div className={`h-4 w-1/2 ${BLOCK}`} />
        <div className={`h-3.5 w-5/6 ${BLOCK}`} />
        <div className={`h-3.5 w-2/5 ${BLOCK}`} />
      </div>
    </div>
  );
}
