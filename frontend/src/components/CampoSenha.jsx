import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "../styles/campoSenha.css";

// Campo de senha com um botão de "olho" que alterna entre ocultar e
// mostrar o texto digitado — usado em todo campo de senha do projeto
// (Login, Cadastro, EsqueciSenha). Recebe as mesmas props de um <input>
// normal (className estiliza o campo, igual antes); só o wrapper e o
// botão de alternância são adicionados por cima.
export default function CampoSenha({ className = "", ...props }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="campo-senha-wrapper">
      <input {...props} type={visivel ? "text" : "password"} className={className} />
      <button
        type="button"
        className="campo-senha-toggle"
        onClick={() => setVisivel((atual) => !atual)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
