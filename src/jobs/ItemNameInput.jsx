import { useState, useEffect, useRef } from "react";

const ItemNameInput = ({
  value,
  onChange,
  suggestions,
  className,
  placeholder,
  required,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = value.trim().toLowerCase();

  const filtered =
    q === ""
      ? []
      : suggestions
          .map((s) => {
            const name = s.toLowerCase();
            if (name === q) return null;
            if (name.startsWith(q)) return { s, rank: 0 };
            if (name.split(/\s+/).some((w) => w.startsWith(q)))
              return { s, rank: 1 };
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => a.rank - b.rank || a.s.localeCompare(b.s))
          .slice(0, 8)
          .map((x) => x.s);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ItemNameInput;
