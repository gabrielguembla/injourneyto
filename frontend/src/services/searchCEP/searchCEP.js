import axios from 'axios';

export async function searchCEP(cep) {
  const cleanCEP = cep.replace(/\D/g, '');

  if (!/^\d{8}$/.test(cleanCEP)) {
    throw new Error('Enter a CEP with eight digits.');
  }

  const response = await axios.get(
    `https://viacep.com.br/ws/${cleanCEP}/json/`
  );

  if (response.data.erro) {
    throw new Error('CEP not found.');
  }

  return {
    logradouro: response.data.logradouro || '',
    bairro: response.data.bairro || '',
    cidade: response.data.localidade || '',
    estado: response.data.uf || ''
  };
}