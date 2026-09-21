import { fields } from '../utils/fields';

const FieldPicker = ({ value, level, onChange, onLevelChange }) => {
  const selectedField = fields.find(f => f.code === value);
  return (
    <div className="grid grid-cols-2 gap-3">
      <select className="input-field" value={value} onChange={(e) => { onChange(e.target.value); onLevelChange(''); }} required>
        <option value="">Select Major *</option>
        {fields.map(f => <option key={f.code} value={f.code}>{f.label}</option>)}
      </select>
      {selectedField && (
        <select className="input-field" value={level} onChange={(e) => onLevelChange(e.target.value)} required>
          <option value="">Degree Level *</option>
          {selectedField.levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      )}
    </div>
  );
};
export default FieldPicker;