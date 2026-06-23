import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

type Variante = "primario" | "secundario" | "perigo";

const VARIANTE_CLASSES: Record<Variante, string> = {
  primario: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600",
  secundario: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:outline-gray-400",
  perigo: "bg-white text-red-600 border border-red-200 hover:bg-red-50 focus-visible:outline-red-500",
};

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANTE_CLASSES[variante]} ${className}`}
    />
  );
}

export function Rotulo({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`mb-1 block text-sm font-medium text-gray-700 ${className}`} />;
}

export function CampoTexto({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    />
  );
}

export function AreaTexto({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    />
  );
}

export function Selecao({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    >
      {children}
    </select>
  );
}
