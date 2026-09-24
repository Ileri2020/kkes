import { HeroSkeleton, ProductGridSkeleton } from "@/components/skeletons";

export default function LoadingHome() {
  return (
    <div className="min-h-screen space-y-8 p-4 md:p-8">
      <HeroSkeleton />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
