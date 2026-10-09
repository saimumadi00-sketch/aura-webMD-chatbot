/*
 * Decorative character-scramble animation, not cryptography. A separate hidden span preserves readable text for assistive tools.
 */

import React, { useEffect, useRef, useState } from "react";

const wrapperStyle = {
  display: "inline-block",
  whiteSpace: "pre-wrap",
  position: "relative",
};

const srOnlyStyle = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  border: 0,
};

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";

const DecryptedText = ({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = DEFAULT_CHARSET,
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  ...props
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduceMotion(preference.matches);
    preference.addEventListener('change', handleChange);
    return () => preference.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    setDisplayText(text);
    setRevealedIndices(new Set());
    setHasAnimated(false);
  }, [text]);

  useEffect(() => {
    // CSS cannot stop this JavaScript timer; show the final heading for reduced motion.
    if (reduceMotion) return;
    let interval;
    let currentIteration = 0;

    // Reveal order controls which character becomes final on each sequential tick.
    const getNextIndex = (revealedSet) => {
      const len = text.length;
      switch (revealDirection) {
        case "end":
          return len - 1 - revealedSet.size;
        case "center": {
          const middle = Math.floor(len / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;
          if (nextIndex >= 0 && nextIndex < len && !revealedSet.has(nextIndex)) {
            return nextIndex;
          }
          for (let i = 0; i < len; i += 1) {
            if (!revealedSet.has(i)) return i;
          }
          return 0;
        }
        case "start":
        default:
          return revealedSet.size;
      }
    };

    // Choose either a unique alphabet from the original text or the supplied scramble alphabet.
    const availableChars = useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((char) => char !== " ")
      : characters.split("");

    // Preserve spaces and already-revealed positions while randomizing the remaining characters.
    const shuffleText = (originalText, currentRevealed) =>
      originalText
        .split("")
        .map((char, i) => {
          if (char === " " || currentRevealed.has(i)) return originalText[i];
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join("");

    // Sequential mode reveals one position per tick; random mode stops after maxIterations.
    if (isHovering) {
      setIsScrambling(true);
      interval = setInterval(() => {
        setRevealedIndices((prev) => {
          if (sequential) {
            if (prev.size < text.length) {
              const nextIndex = getNextIndex(prev);
              const nextSet = new Set(prev);
              nextSet.add(nextIndex);
              setDisplayText(shuffleText(text, nextSet));
              return nextSet;
            }
            clearInterval(interval);
            setIsScrambling(false);
            setDisplayText(text);
            return prev;
          }
          setDisplayText(shuffleText(text, prev));
          currentIteration += 1;
          if (currentIteration >= maxIterations) {
            clearInterval(interval);
            setIsScrambling(false);
            setDisplayText(text);
          }
          return prev;
        });
      }, speed);
    } else if (!isHovering && isScrambling) {
      setIsScrambling(false);
      setDisplayText(text);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isHovering,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    characters,
    useOriginalCharsOnly,
    isScrambling,
    reduceMotion,
  ]);

  useEffect(() => {
    if (reduceMotion) return;
    if (animateOn !== "view" && animateOn !== "both") return;

    // View-triggered animations run once until a changed text prop resets hasAnimated.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsHovering(true);
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    const ref = containerRef.current;
    if (ref) observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [animateOn, hasAnimated, reduceMotion]);

  const interactiveProps =
    animateOn === "hover" || animateOn === "both"
      ? {
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => {
            setIsHovering(false);
            setRevealedIndices(new Set());
          },
        }
      : {};

  return (
    <span
      ref={containerRef}
      className={parentClassName}
      style={wrapperStyle}
      {...interactiveProps}
      {...props}
    >
      <span style={srOnlyStyle}>{text}</span>
      <span aria-hidden="true">
        {(reduceMotion ? text : displayText).split("").map((char, index) => {
          const isFinal =
            reduceMotion ||
            revealedIndices.has(index) ||
            (!isScrambling && (hasAnimated || animateOn === "view")) ||
            (!isHovering && animateOn === "hover");
          return (
            <span
              key={`${char}-${index}`}
              className={isFinal ? className : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
};

export default DecryptedText;
