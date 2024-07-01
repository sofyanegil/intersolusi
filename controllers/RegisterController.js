const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: 'Email is already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    res.status(201).send({
      success: true,
      message: 'Register successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { register };
