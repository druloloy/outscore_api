const nodemailer = require('nodemailer');
const hbs = require('handlebars');
const fs = require('fs/promises');
const path = require('path');

const MAIL = process.env.EMAIL;
const PASS = process.env.EMAIL_PASSWORD;

const passwordMailData = {
    firstName: '',
    lastName: '',
    password: ''
}

exports.sendPasswordMail = async (to, subject,  data = passwordMailData) => {
    const templateName = '_password';

    const template = await getTemplate(templateName);
    if(template instanceof Error) return Promise.reject(template);

    const html = transformTemplate(template, data);
    const mailOptions = {
        from: `Outscore <${MAIL}>`,
        to,
        subject,
        html
    };
    return transporter.sendMail(mailOptions);
}


const getTemplate = (templateName) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, `./templates/${templateName}.hbs`), 'utf-8')
            .then((file) => {
                resolve(file)
            })
            .catch((err) => {
                reject(err)
            })
    });
}

const transformTemplate = (template, data) => {
    const compiled = hbs.compile(template);
    return compiled(data);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: MAIL,
        pass: PASS
    }
});
