const generateTemplate = info => {
    return `
          <strong>Hello ${info.name}</strong>
          <br>
          <p>Thank you. We have received your registration form.
          Here is your Link</p>
  
          <a href=${info.link}>Verify</a>
          <br>
          <p>Or copy Paste the Link</p>
          <br>
          <p>${info.link}</p>
          <br><br>
      `;
  };
  
  module.exports = generateTemplate