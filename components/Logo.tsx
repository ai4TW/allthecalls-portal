import Image from "next/image";

type Props = {
  variant?: "full" | "mark";
  className?: string;
};

export default function Logo({ variant = "full", className = "" }: Props) {
  if (variant === "mark") {
    return (
      <Image
        src="/favicon.svg"
        alt="AllTheCalls"
        width={36}
        height={36}
        className={className || "h-9 w-9"}
        priority
      />
    );
  }
  return (
    <Image
      src="/logo.svg"
      alt="AllTheCalls.ai"
      width={300}
      height={72}
      className={className || "h-9 w-auto"}
      priority
    />
  );
}
