export const userRegister  = async (req, res) => {
    const { name, email, password } = req.body;
    if(!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
    }
    try{
        const existingUser = await prisma.user.findUnique({
            where:{
                email: email
            }
        })
        if(existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
       const newUser = await prisma.user.create({
        data:{
            name,
            email,
            password: hashedPassword
        }
    })
    return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const userLogin = async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try{
        const user = await prisma.user.findUnique({
            where:{
                email: email
            }
        })
        if(!user) {
            return res.status(400).json({ message: "User with this email does not exist" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ message: "Login successful", token });    
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}   

export const getUserProfile = async (req, res) => {
    const userId = req.user.id;
    try{
        const user = await prisma.user.findUnique({
            where:{
                id: userId
            }
        })
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}   
export const updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, password } = req.body;
    try{
        const user = await prisma.user.findUnique({
            where:{
                id: userId
            }
        })
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const updatedData = {};
        if(name) updatedData.name = name;      
        if(email) updatedData.email = email;
        if(password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedData.password = hashedPassword;
        }
        const updatedUser = await prisma.user.update({
            where:{
                id: userId
            },
            data: updatedData
        })
        return res.status(200).json({ message: "User profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}