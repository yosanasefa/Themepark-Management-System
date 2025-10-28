import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Input from '../../input/Input';
import CustomButton from '../../button/CustomButton';
import './Login.css';

function Login({ setAdmin }) {
  const [isE, setIsE] = useState(false);
  const [validated, setValidated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const API_BASE = "http://localhost:3001"; // match your backend port

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      if (isE) {
        try {
          // Call your backend to check employee login
          const res = await fetch(`${API_BASE}/manager-info/${email}`);
          const data = await res.json();

          if (res.ok && data.email) {
            if (data.password && data.password === password) {
              // ✅ You can verify password in DB later (currently plaintext)
              setAdmin(true);
              localStorage.setItem('user', JSON.stringify(data));
              navigate('/managerpage', { state: { employee: data } });
            } else {
              alert("Invalid password.");
            }
          } else {
            alert("Employee not found.");
          }
        } catch (err) {
          console.error("Login error:", err);
          alert("Login failed. Check backend connection.");
        }
      } else {
        alert("Non-employee login not implemented yet");
      }
    }

    setValidated(true);
  };

  return (
    <div className="min-h-screen bg-[#FFFBDE] flex items-center justify-center">
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <div className='flex flex-col gap-4 items-center bg-[#EEF5FF] rounded-2xl p-4 w-200 shadow-2xl mx-auto'>
          <h1>Welcome to our Theme Park</h1>
          <p>Log In or <Link to="/signup"><span className='hover:outline-dashed font-bold'>Create an account</span></Link></p>
          
          <Input 
            size="15" 
            type="text" 
            label="Email" 
            feedback="Please provide a valid email." 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input 
            size="15" 
            type="password" 
            label="Password" 
            feedback="Password is required." 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div>
            <input 
              type="checkbox" 
              className="accent-[#176B87]"  
              checked={isE}
              onChange={(e) => setIsE(e.target.checked)}
            /> Log in as employee
          </div>

          <div><CustomButton text="Log In" /></div>
        </div>
      </Form>
    </div>
  );
}

export default Login;
