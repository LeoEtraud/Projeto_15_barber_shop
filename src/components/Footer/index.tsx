export function Footer() {
  return (
    <footer className="bg-[var(--bg-card)] border-t border-[var(--border-primary)] py-2 px-4 mt-auto transition-colors duration-300">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-xs font-normal text-[var(--text-secondary)] my-1 transition-colors duration-300">
          Desenvolvido por{" "}
          <a
            className="text-blue-500 hover:text-blue-700 cursor-pointer transition-colors duration-300"
            href="https://portfolio-pessoal-dev.vercel.app/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Leonardo Duarte
          </a>
        </h3>
      </div>
    </footer>
  );
}
