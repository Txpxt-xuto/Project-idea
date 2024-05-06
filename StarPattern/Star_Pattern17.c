#include <stdio.h>
int main()//ลูกศรชี้ทางทิศตะวันออกเฉียงเหนือ//
{
    int n,i,j;
    scanf("%d",&n);
    for(i=0;i<=n/2;i++)
    {
        for(j=n;j>n-i;j--) printf("  ");
        for(j=i;j<n;j++) printf("* ");
        printf("\n");
    }
    for(i=(n/2)+1;i<n;i++)
    {
        for(j=n-i;j>1;j--) printf("  ");
        printf("*");
        for(j=2;j<2*(i-(n/2))+1;j++) printf("  ");
        printf(" ");
        for(j=i;j<n;j++) printf("* ");
        printf("\n");
    }
}