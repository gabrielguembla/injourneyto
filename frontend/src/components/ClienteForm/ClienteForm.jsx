import { useState } from 'react';
import { searchCEP } from '../../services/searchCEP/searchCEP';

export default function ClienteForm({
  googleProfile,
  onSubmit,
  loading
}) {
  const [dados, setDados] = useState(() => {
    const names = (googleProfile.name || '').trim().split(/\s+/);

    return {
      first_name: names[0] || '',
      last_name: names.slice(1).join(' '),
      cep: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      ponto_referencia: '',
      logradouro: ''
    };
  });

  const [cepMessage, setCepMessage] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setDados((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleCEPBlur() {
    const cleanCEP = dados.cep.replace(/\D/g, '');

    if (!cleanCEP) return;

    try {
      setCepMessage('Searching CEP...');

      const address = await searchCEP(cleanCEP);

      setDados((previous) => ({
        ...previous,
        cep: cleanCEP,
        logradouro: address.logradouro,
        bairro: address.bairro,
        cidade: address.cidade,
        estado: address.estado
      }));

      setCepMessage('Address found. Check the information.');
    } catch (error) {
      setCepMessage(error.message || 'Could not search this CEP.');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(dados);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Complete your profile</h2>
      <p>Google account: {googleProfile.email}</p>

      <label>
        First name
        <input
          name="first_name"
          value={dados.first_name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Last name
        <input
          name="last_name"
          value={dados.last_name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        CEP
        <input
          name="cep"
          value={dados.cep}
          onChange={handleChange}
          onBlur={handleCEPBlur}
          placeholder="01001-000"
          required
        />
      </label>

      {cepMessage && <p role="status">{cepMessage}</p>}

      <label>
        Street
        <input
          name="logradouro"
          value={dados.logradouro}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Number
        <input
          name="numero"
          value={dados.numero}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Complement
        <input
          name="complemento"
          value={dados.complemento}
          onChange={handleChange}
        />
      </label>

      <label>
        Neighborhood
        <input
          name="bairro"
          value={dados.bairro}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        City
        <input
          name="cidade"
          value={dados.cidade}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        State (UF)
        <input
          name="estado"
          value={dados.estado}
          onChange={handleChange}
          maxLength={2}
          required
        />
      </label>

      <label>
        Reference point (optional)
        <input
          name="ponto_referencia"
          value={dados.ponto_referencia}
          onChange={handleChange}
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Complete registration'}
      </button>
    </form>
  );
}