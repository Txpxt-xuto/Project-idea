# LCD word #
import pyfiglet
from termcolor import colored
def LCD(word):
    masssage = pyfiglet.figlet_format(word)       
    colored_massage = colored(masssage,color = 'yellow')
    print(colored_massage)                     #จุดเปลี่ยนสีตรงนี้#
word = input("Enter : ")

LCD(word)
