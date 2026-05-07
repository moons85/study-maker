# 구현 플랜

## 반영할 기획

- 타겟은 개발자가 아니라 모든 학습자
- 학습 주제는 넓게 허용하되 제한 주제는 차단/전환
- AI 호출 전 주제 오타와 모호성을 확인
- 초급 → 중급 → 고급 단계형 문제 제공
- 단계별 문제는 10개 고정
- 문제 유형은 랜덤 혼합
- 문제별 힌트 제공
- 학습 기록은 폴더 구조로 저장
- AI 토큰 사용량 최소화
- 백엔드 보안, 중복성, 동시성 강화
- 문제 풀이 후 홈으로 돌아가기
- 서술형 문제 질문과 평가 기준 강화
- 오답 결과에서 정답과 해설 공개
- 10번째 문제의 제출 버튼 클릭 시점에만 채점 시작
- 생성/채점/페이지 이동별 맞춤 로딩 화면
- 공식/백과/커뮤니티 출처 기반 개념 강화
- 오답노트
- 백과사전형 책 넘김 리더
- 복습 스케줄, 진단 테스트, 숙련도 지도 등 장기 학습 기능
- 로고와 학습 오브젝트 중심의 캐주얼 UI 개편

## 작업 순서

1. DB 마이그레이션
   - `study_folders`
   - `ai_generation_cache`
   - `generation_locks`
   - `study_sessions.folder_id`
   - `study_sessions.normalized_topic`
   - `study_sessions.current_stage`
   - `study_sessions.unlocked_stage`
   - `questions.stage`
   - `questions.hint`
   - `questions.related_concept`
   - `submissions.stage`
   - `submissions.hint_usage`
   - `submissions.unlocked_next_stage`

2. 주제 검증 API
   - `POST /api/topics/validate`
   - AI 호출 없이 로컬 규칙으로 처리
   - 오타 후보, 너무 넓은 주제, 제한 주제 검사
   - `normalizedTopic`과 suggestions 반환

3. 타입과 Zod 수정
   - `questionCount`, `questionTypes` 제거
   - `stage`, `normalizedTopic`, `folderId`, `idempotencyKey` 추가
   - `hint`, `relatedConcept`, `unlockedStage` 추가

4. 생성 API 수정
   - stage 기반 생성
   - 문제 수 10개 고정
   - 중급/고급 잠금 확인
   - 캐시 조회
   - generation lock 적용
   - idempotency key 적용
   - 실패 시 보상 삭제
   - 서술형 문제는 구체적인 상황, 요구 분량, 포함할 핵심 요소를 포함하도록 프롬프트 강화

5. 채점 API 수정
   - 객관식/OX/빈칸은 서버 채점
   - 주관식/서술형만 AI 평가
   - 70점 이상이면 다음 단계 unlock
   - hintUsage 저장
   - 오답 결과에 correctAnswer와 explanation을 반드시 포함
   - 서술형 평가 시 정답/평가 기준을 함께 전달

6. UI 수정
   - 상단 홈 버튼 추가
   - 생성/채점/페이지 이동별 로딩 화면 추가
   - 홈에 로고, 학습 경로 지도, 오늘의 복습, 최근 학습 카드 추가
   - 홈에서 난이도/문제 유형/문제 수 제거
   - 주제 검증 확인 UI 추가
   - 폴더 선택 UI 추가
   - 단계별 잠금/해제 UI 추가
   - 힌트 패널 추가
   - 결과 화면에 다음 단계 CTA 추가
   - 결과 화면에 홈으로 돌아가기 CTA 추가
   - 1~9번 문제에서는 다음 버튼만 표시하고 10번 문제에서 제출 버튼 표시
   - 결과의 오답 카드에 정답과 해설 표시

7. 라이브러리 추가
   - `/library`
   - `/folders/[folderId]`

8. 백엔드 품질 보강
   - rate limit
   - RLS
   - Zod 검증
   - 캐시 만료
   - 로그 정리
   - 에러 메시지 표준화

9. V4 오답노트
   - `wrong_notes` 테이블 추가
   - grade API에서 오답 자동 저장
   - `/wrong-notes` 페이지 추가
   - 오답 원인, 관련 개념, 다시 풀기, 복습 완료 구현

10. V5 백과사전형 리더
   - `content.articlePages` 또는 `study_article_pages` 설계
   - `/encyclopedia/[sessionId]` 페이지 추가
   - 데스크톱 책 펼침, 모바일 카드 넘김 구현
   - 표지/개요/배경지식/핵심 개념/용어/오개념/출처 페이지 제공

11. V6 출처 기반 개념 강화
   - `study_sources` 테이블 추가
   - `/api/sources/search` 추가
   - 공식/백과/강의/커뮤니티 출처 타입과 신뢰도 배지 저장
   - generate API가 출처 요약을 기반으로 개념을 재구성
   - 나무위키는 보조 커뮤니티 출처로 표시

12. V7 장기 학습 시스템
   - 복습 스케줄
   - 진단 테스트
   - 학습 목표 설정
   - 숙련도 지도
   - 개념 검색
   - 북마크/메모
   - 자신감 체크
   - 약점 기반 추천
   - 시험 모드
   - 학습 리포트

## 검증 기준

- 오타 주제가 AI 호출 전에 확인된다.
- 너무 넓은 주제는 하위 주제를 제안한다.
- 제한 주제는 차단 또는 안전한 학습 모드로 전환된다.
- 새 학습은 초급부터 시작한다.
- 초급 70점 이상이면 중급이 열린다.
- 중급 70점 이상이면 고급이 열린다.
- 중복 클릭해도 세션이 중복 생성되지 않는다.
- 동일 주제/단계는 캐시를 사용한다.
- 10번째 문제에서 제출 버튼을 눌렀을 때만 채점이 시작된다.
- 서술형 문제는 모호하지 않고 답변 조건이 명확하다.
- 오답은 결과 화면에서 정답과 해설을 확인할 수 있다.
- 결과 화면에서 홈으로 돌아갈 수 있다.
- 생성/채점/페이지 이동마다 적절한 로딩 화면이 나온다.
- 오답노트에서 틀린 문제를 다시 볼 수 있다.
- 백과사전형 리더에서 만든 주제를 책처럼 넘겨볼 수 있다.
- 공식/백과/커뮤니티 출처가 구분되어 표시된다.
- 홈 화면이 텍스트/버튼 위주가 아니라 학습 경로와 브랜드 오브젝트 중심으로 보인다.
