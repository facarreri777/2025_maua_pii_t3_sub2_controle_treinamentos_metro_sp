# 🚇 Sistema de Controle de Treinamentos - Metro SP

## 📋 Como Acessar o Sistema

### 🔐 **Tela de Login**
Abra o arquivo: `2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html`

---

## 👨‍🏫 **Acesso do Instrutor**

### **Credenciais:**
- **Tipo:** Selecione "Instrutor"
- **Usuário:** `instrutor`
- **Senha:** `metro123`

**Nota:** Instrutor usa **usuário/email**, não RG Metro

### **Após o Login:**
- Será redirecionado para a **Tela Home do Instrutor**
- Pode gerenciar treinamentos e colaboradores
- Acesso aos 4 módulos: Cadastro De Treinamentos, Acompanhamento De Treinamento, Cadastro De Colaboradores, Registro De Presença

---

## 🎓 **Acesso do Aluno**

### **Pré-requisito:**
1. O **Instrutor** deve cadastrar o colaborador primeiro em **Cadastro de Colaboradores**
2. Durante o cadastro, o instrutor define:
   - RG Metro do colaborador (7 dígitos)
   - Senha inicial escolhida pelo colaborador
   - Outros dados (nome, email, cargo, setor)

### **Credenciais:**
- **Tipo:** Selecione "Aluno"
- **RG Metro:** [7 dígitos definidos no cadastro]
- **Senha:** [Senha escolhida no cadastro]

### **Após o Login:**
- Será redirecionado para a **Tela Home do Aluno**
- Acesso aos 3 módulos: Meus Treinamentos, Acompanhar Progresso, Meus Certificados

---

## ⚠️ **Importante**

- **Instrutor:** Login com **usuário/email** + senha (acesso direto)
- **Aluno:** Login com **RG Metro** (7 dígitos) + senha (precisa ser cadastrado)
- O campo de entrada muda automaticamente ao selecionar o tipo de usuário
- Os dados são armazenados no banco de dados MongoDB (ou localStorage como fallback)
- Para limpar dados locais, limpe o localStorage do navegador

---

## 🔗 **Arquivos do Sistema**

- **Login:** `tela_login.html`
- **Home Instrutor:** `tela_home.html`
- **Home Aluno:** `aluno_home.html`
