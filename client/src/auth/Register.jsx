import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext.jsx";

export default function Register() {
	const { register } = useContext(AuthContext);
	const nav = useNavigate();
	const [msg, setMsg] = useState("");
	const [form, setForm] = useState({
		username: "",
		password: "",
		email: "",
		mobile: "",
		address: "",
		experienceYears: "",
		soilType: "",
		age: "",
		dob: "",
		gender: "",
	});

	const submit = async (e) => {
		e.preventDefault();
		setMsg("");
		try {
			await register(form);
			setMsg("Registered successfully. Please login.");
			setTimeout(() => nav("/login"), 700);
		} catch {
			setMsg("Registration failed");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-green-50">
			<form
				onSubmit={submit}
				className="w-full max-w-2xl bg-white p-6 rounded shadow grid grid-cols-2 gap-3"
			>
				<h1 className="col-span-2 text-xl font-semibold mb-2">
					Create Account
				</h1>
				{msg && <div className="col-span-2 text-green-700">{msg}</div>}
				<input
					className="input"
					placeholder="Username"
					value={form.username}
					onChange={(e) => setForm({ ...form, username: e.target.value })}
				/>
				<input
					className="input"
					placeholder="Email"
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
				/>
				<input
					className="input"
					type="password"
					placeholder="Password"
					value={form.password}
					onChange={(e) => setForm({ ...form, password: e.target.value })}
				/>
				<input
					className="input"
					placeholder="Mobile"
					value={form.mobile}
					onChange={(e) => setForm({ ...form, mobile: e.target.value })}
				/>
				<input
					className="input col-span-2"
					placeholder="Address"
					value={form.address}
					onChange={(e) => setForm({ ...form, address: e.target.value })}
				/>
				<input
					className="input"
					placeholder="Experience Years"
					value={form.experienceYears}
					onChange={(e) =>
						setForm({ ...form, experienceYears: e.target.value })
					}
				/>
				<input
					className="input"
					placeholder="Soil Type"
					value={form.soilType}
					onChange={(e) => setForm({ ...form, soilType: e.target.value })}
				/>
				<input
					className="input"
					placeholder="Age"
					value={form.age}
					onChange={(e) => setForm({ ...form, age: e.target.value })}
				/>
				<input
					className="input"
					type="date"
					placeholder="DOB"
					value={form.dob}
					onChange={(e) => setForm({ ...form, dob: e.target.value })}
				/>
				<input
					className="input"
					placeholder="Gender"
					value={form.gender}
					onChange={(e) => setForm({ ...form, gender: e.target.value })}
				/>
				<button className="btn col-span-2 mt-2">Register</button>
				<p className="col-span-2 text-sm mt-2">
					Have an account?{" "}
					<Link className="link" to="/login">
						Login
					</Link>
				</p>
			</form>
		</div>
	);
}
