// O navegador decodifica AVIF? Responde decodificando uma imagem AVIF de 1x1
// (a mesma checagem usada por Modernizr/web.dev). Usado pela pré-busca do
// mapa no Login, que precisa baixar o MESMO arquivo que o <picture> da Home
// vai escolher — senão baixaria um mapa de 341 KB à toa.
const AVIF_1X1 =
  "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";

let resposta;
export function suportaAvif() {
  resposta ??= new Promise((resolver) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem.width > 0);
    imagem.onerror = () => resolver(false);
    imagem.src = AVIF_1X1;
  });
  return resposta;
}
