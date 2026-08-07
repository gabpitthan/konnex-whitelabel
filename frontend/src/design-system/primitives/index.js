import React from "react";
import "./primitives.css";

/**
 * Componentes compartilhados do design system (ADR-0004).
 *
 * Sem dependência de Material UI, de propósito: uma tela que passa a usar
 * estes componentes deixa de depender do v4, e a cobertura do redesign vira
 * contável. Era a falta desse critério que fazia entregas anteriores serem
 * declaradas prontas estando parciais.
 *
 * Regra: um padrão por problema. Se uma página precisa de algo que não existe
 * aqui, o componente entra aqui — não vira estilo local.
 */

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------ PageHeader -- */

/**
 * Cabeçalho único de página: título, descrição opcional e ações à direita,
 * com a ação primária por último. Substitui os cabeçalhos que cada tela
 * inventava — a inconsistência mais visível do frontend legado.
 */
export const PageHeader = ({ title, description, actions, className }) => (
  <header className={cx("ds-pagehead", className)}>
    <div className="ds-pagehead__text">
      <h1 className="ds-pagehead__title">{title}</h1>
      {description && <p className="ds-pagehead__desc">{description}</p>}
    </div>
    {actions && <div className="ds-pagehead__actions">{actions}</div>}
  </header>
);

/* ---------------------------------------------------------------- Button -- */

export const Button = ({
  variant = "secondary",
  size = "md",
  block = false,
  type = "button",
  className,
  children,
  ...rest
}) => (
  <button
    type={type}
    className={cx(
      "ds-button",
      `ds-button--${variant}`,
      size !== "md" && `ds-button--${size}`,
      block && "ds-button--block",
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

/**
 * Botão só de ícone. `label` é obrigatório e vira `aria-label` e `title`:
 * ícone sem nome acessível é inoperável por leitor de tela.
 */
export const IconButton = ({ label, bordered = false, className, children, ...rest }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cx("ds-iconbutton", bordered && "ds-iconbutton--bordered", className)}
    {...rest}
  >
    {children}
  </button>
);

/* ----------------------------------------------------------- Form fields -- */

export const Input = ({ label, error, hint, id, className, ...rest }) => {
  const fieldId = id || rest.name;
  return (
    <div className="ds-field">
      {label && (
        <label className="ds-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={cx("ds-input", error && "ds-input--invalid", className)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
      {error && (
        <span className="ds-field__error" id={`${fieldId}-error`} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span className="ds-field__hint" id={`${fieldId}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
};

export const Select = ({ label, error, id, className, children, ...rest }) => {
  const fieldId = id || rest.name;
  return (
    <div className="ds-field">
      {label && (
        <label className="ds-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <select id={fieldId} className={cx("ds-select", className)} {...rest}>
        {children}
      </select>
      {error && (
        <span className="ds-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export const Textarea = ({ label, error, id, className, ...rest }) => {
  const fieldId = id || rest.name;
  return (
    <div className="ds-field">
      {label && (
        <label className="ds-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <textarea id={fieldId} className={cx("ds-textarea", className)} {...rest} />
      {error && (
        <span className="ds-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ FiltersBar -- */

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" strokeLinecap="round" />
  </svg>
);

/** Filtros ficam junto do conteúdo que controlam, não num card à parte. */
export const FiltersBar = ({ searchValue, onSearch, searchPlaceholder = "Buscar", children }) => (
  <div className="ds-filters">
    {onSearch && (
      <div className="ds-filters__search">
        <span className="ds-filters__search-icon">
          <SearchIcon />
        </span>
        <input
          className="ds-input"
          type="search"
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
    )}
    {children}
  </div>
);

/* ------------------------------------------------------------------ Tabs -- */

export const Tabs = ({ value, onChange, items }) => (
  <div className="ds-tabs" role="tablist">
    {items.map((item) => (
      <button
        key={item.value}
        role="tab"
        type="button"
        aria-selected={value === item.value}
        className="ds-tab"
        onClick={() => onChange(item.value)}
      >
        {item.label}
        {typeof item.count === "number" && <span className="ds-tab__count">{item.count}</span>}
      </button>
    ))}
  </div>
);

/* ----------------------------------------------------------------- Table -- */

export const Table = ({ clickable = false, className, children, ...rest }) => (
  <div className="ds-table-wrap">
    <table className={cx("ds-table", clickable && "ds-table--clickable", className)} {...rest}>
      {children}
    </table>
  </div>
);

/* ------------------------------------------------------------------ Card -- */

export const Card = ({ className, children, ...rest }) => (
  <div className={cx("ds-card", className)} {...rest}>
    {children}
  </div>
);

Card.Header = ({ title, children, className }) => (
  <div className={cx("ds-card__header", className)}>
    {title && <h2 className="ds-card__title">{title}</h2>}
    {children}
  </div>
);

Card.Body = ({ flush = false, className, children }) => (
  <div className={cx("ds-card__body", flush && "ds-card__body--flush", className)}>{children}</div>
);

/* ----------------------------------------------------------------- Badge -- */

export const Badge = ({ tone = "neutral", className, children }) => (
  <span className={cx("ds-badge", `ds-badge--${tone}`, className)}>{children}</span>
);

/* ------------------------------------------------------------- StatusDot -- */

/**
 * `tone` carrega significado operacional, não estética:
 * live = ativo agora, wait = transição, fail = exige ação, off = inativo.
 * O rótulo textual acompanha sempre — estado nunca depende só de cor.
 */
export const StatusDot = ({ tone = "off", label, className }) => (
  <span className={cx("ds-statusdot", `ds-statusdot--${tone}`, className)}>
    <span className="ds-statusdot__dot" aria-hidden="true" />
    {label && <span>{label}</span>}
  </span>
);

/* ---------------------------------------------------------------- Metric -- */

/** Métrica sempre com contexto: número sem comparação não orienta decisão. */
export const Metric = ({ label, value, context }) => (
  <div className="ds-metric">
    <span className="ds-metric__label">{label}</span>
    <span className="ds-metric__value">{value}</span>
    {context && <span className="ds-metric__context">{context}</span>}
  </div>
);

/* ---------------------------------------------------------------- Avatar -- */

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const Avatar = ({ src, name = "", size = "md", className }) => (
  <span
    className={cx("ds-avatar", size !== "md" && `ds-avatar--${size}`, className)}
    title={name || undefined}
  >
    {src ? <img src={src} alt={name} /> : initialsOf(name)}
  </span>
);

/* ------------------------------------------------------------ EmptyState -- */

/** Estado vazio orienta o próximo passo — não é só "nada aqui". */
export const EmptyState = ({ title, hint, action }) => (
  <div className="ds-empty">
    <div className="ds-empty__title">{title}</div>
    {hint && <div className="ds-empty__hint">{hint}</div>}
    {action && <div className="ds-empty__action">{action}</div>}
  </div>
);

/* -------------------------------------------------------------- Skeleton -- */

export const Skeleton = ({ width = "100%", height = 14, className, style }) => (
  <div
    className={cx("ds-skeleton", className)}
    style={{ width, height, ...style }}
    aria-hidden="true"
  />
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }).map((__, c) => (
          <td key={c}>
            <Skeleton width={c === 0 ? "60%" : "40%"} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export default {
  PageHeader,
  Button,
  IconButton,
  Input,
  Select,
  Textarea,
  FiltersBar,
  Tabs,
  Table,
  Card,
  Badge,
  StatusDot,
  Metric,
  Avatar,
  EmptyState,
  Skeleton,
  TableSkeleton,
};
