"use client";

import { useEffect, useMemo, useState } from "react";

const ONBOARDING_KEY = "study-maker-onboarding-seen";

type SpotlightRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const steps = [
  {
    selector: "[data-tour='topic-input']",
    title: "배우고 싶은 주제를 입력해요",
    description:
      "역사, 수학, 영어, 취미처럼 무엇이든 입력할 수 있어요. 오타나 너무 넓은 주제는 AI 호출 전에 먼저 확인합니다.",
  },
  {
    selector: "[data-tour='create-study']",
    title: "AI가 개념과 문제를 만들어요",
    description:
      "초급 단계부터 시작하고, OX·객관식·주관식·서술형 문제가 랜덤으로 10개 생성됩니다.",
  },
  {
    selector: "[data-tour='learning-path']",
    title: "점수에 따라 다음 단계가 열려요",
    description:
      "초급 70점 이상이면 중급, 중급 70점 이상이면 고급으로 넘어가는 학습 경로입니다.",
  },
  {
    selector: "[data-tour='wrong-notes']",
    title: "틀린 문제는 오답노트에서 복습해요",
    description:
      "오답, 정답, 해설, 약한 개념을 모아 다시 볼 수 있어요. 학습이 끝난 뒤 복습 흐름까지 이어집니다.",
  },
];

export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  const tooltipPosition = useMemo(() => {
    if (!targetRect) {
      return {
        left: 20,
        top: 96,
      };
    }

    const cardWidth = 340;
    const cardHeight = 360;
    const nextLeft = Math.min(
      Math.max(20, targetRect.left),
      Math.max(20, window.innerWidth - cardWidth - 20),
    );
    const belowTop = targetRect.top + targetRect.height + 18;
    const aboveTop = targetRect.top - 220;
    const nextTop =
      belowTop + 220 < window.innerHeight ? belowTop : Math.max(86, aboveTop);

    return {
      left: nextLeft,
      top: Math.min(nextTop, Math.max(86, window.innerHeight - cardHeight)),
    };
  }, [targetRect]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.localStorage.getItem(ONBOARDING_KEY) !== "true") {
        setIsOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document
        .querySelectorAll("[data-tour-active='true']")
        .forEach((node) => node.removeAttribute("data-tour-active"));
      return;
    }

    function updateTarget() {
      document
        .querySelectorAll("[data-tour-active='true']")
        .forEach((node) => node.removeAttribute("data-tour-active"));

      const target = document.querySelector(currentStep.selector);
      if (!target) {
        setTargetRect(null);
        return;
      }

      target.setAttribute("data-tour-active", "true");
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          height: rect.height,
          left: rect.left,
          top: rect.top,
          width: rect.width,
        });
      }, 180);
    }

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, { passive: true });

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget);
      document
        .querySelectorAll("[data-tour-active='true']")
        .forEach((node) => node.removeAttribute("data-tour-active"));
    };
  }, [currentStep.selector, isOpen]);

  function closeGuide(remember: boolean) {
    if (remember) {
      window.localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setIsOpen(false);
    setActiveStep(0);
  }

  function openGuide() {
    setActiveStep(0);
    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openGuide}
        className="fixed bottom-5 right-5 z-40 rounded-full border-2 border-purple-100 bg-white px-4 py-3 text-sm font-black text-purple-700 shadow-[0_6px_24px_rgba(23,32,51,0.12)]"
      >
        사용법
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-slate-950/42 backdrop-blur-[2px]" />
          {targetRect ? (
            <div
              className="onboarding-spotlight"
              style={{
                height: targetRect.height + 20,
                left: targetRect.left - 10,
                top: targetRect.top - 10,
                width: targetRect.width + 20,
              }}
            />
          ) : null}

          <section
            className="pointer-events-auto fixed w-[calc(100vw-40px)] max-w-[340px] rounded-[28px] border-2 border-lime-100 bg-white p-5 text-slate-950 shadow-[0_12px_0_#d7e7c8,0_24px_64px_rgba(23,32,51,0.2)]"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              zIndex: 70,
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                {activeStep + 1} / {steps.length}
              </span>
              <button
                type="button"
                onClick={() => closeGuide(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
              >
                닫기
              </button>
            </div>

            <div className="mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-lime-100 text-2xl shadow-sm">
              {activeStep === 0 ? "?" : activeStep === 1 ? "10" : activeStep === 2 ? "70" : "✓"}
            </div>
            <h2 className="text-xl font-black leading-snug">
              {currentStep.title}
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
              {currentStep.description}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 0) return;
                  setActiveStep((step) => step - 1);
                }}
                disabled={activeStep === 0}
                className="h-11 flex-1 rounded-[18px] border-2 border-slate-200 bg-white text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLastStep) {
                    closeGuide(true);
                    return;
                  }
                  setActiveStep((step) => step + 1);
                }}
                className="app-primary-button h-11 flex-1 text-sm font-black"
              >
                {isLastStep ? "시작하기" : "다음"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => closeGuide(true)}
              className="mt-3 w-full rounded-full bg-lime-50 px-4 py-2 text-xs font-black text-lime-700"
            >
              다시 보지 않기
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
