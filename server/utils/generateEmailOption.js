const generateEmailOption = ({ to, subject, template }) => {
  return {
    from: '"mustak" <mustak@gmail.com>',
    to,
    subject,
    html: template
  };
};

module.exports = generateEmailOption;
