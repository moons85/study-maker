import { PageLoading } from "@/components/common/PageLoading";

export default function QuizLoading() {
  return (
    <PageLoading
      title="문제를 준비하고 있어요"
      description="현재 단계의 10문제와 힌트를 불러오는 중입니다."
    />
  );
}
