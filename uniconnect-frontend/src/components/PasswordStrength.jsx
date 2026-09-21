const PasswordStrength = ({ password }) => {
  const rules = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'Number', test: (p) => /[0-9]/.test(p) },
    { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const passed = rules.filter(r => r.test(password)).length;
  let strength = 'Empty', color = 'bg-gray-200', width = '0%', textColor = 'text-gray-500';

  if (password.length > 0) {
    if (passed <= 1) { strength = 'Weak'; color = 'bg-red-500'; width = '33%'; textColor = 'text-red-500'; }
    else if (passed <= 3) { strength = 'Medium'; color = 'bg-yellow-500'; width = '66%'; textColor = 'text-yellow-600'; }
    else { strength = 'Strong'; color = 'bg-green-500'; width = '100%'; textColor = 'text-green-600'; }
  }

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${textColor}`}>Strength: {strength}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-300`} style={{ width }}></div>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        {rules.map((rule, i) => (
          <li key={i} className={`flex items-center gap-1 ${rule.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
            {rule.test(password) ? '✓' : '○'} {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default PasswordStrength;